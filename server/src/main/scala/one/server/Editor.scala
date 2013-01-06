package one.server

import java.io.File
import java.security.MessageDigest

import scala.util.Properties

import org.fusesource.scalate.TemplateEngine

import unfiltered.Cookie
import unfiltered.netty._
import unfiltered.request._
import unfiltered.response._

import unfiltered.scalate.Scalate

import unfiltered.netty.request._

import dispatch.classic._

import dispatch.classic.json.Js
import dispatch.classic.json.JsHttp._

import com.typesafe.config._

import scalaz._, Scalaz._, PLens._
import effect._

import com.ephox.argonaut._, Argonaut._

case class Editor(client: nio.Http) extends async.Plan with ServerErrorResponse {

  val CONTENT = "content"

  val config = ConfigFactory.load()

  object Github {
    val CLIENT_ID = "client_id"
    val CLIENT_SECRET = "client_secret"
    val CODE = "code"
    val STATE = "state"
    private val github = config.getConfig("github")
    val id = github.getString(CLIENT_ID)
    val secret = github.getString(CLIENT_SECRET)
    object Code extends Params.Extract(
      CODE,
      Params.first ~> Params.nonempty
    )
    object State extends Params.Extract(
      STATE,
      Params.first
    )
  }

  object Pusher {
    private val pusher = config.getConfig("pusher")
    val id = pusher.getString("app_id")
    val key = pusher.getString("key")
    val secret = pusher.getString("secret")
  }

  implicit val template = TemplateEngine(new File(getClass.getResource("/templates").toURI) :: Nil, "production")

  def index[A](req: HttpRequest[A], filename: String, content: String = "") = {
    HtmlContent ~> Scalate(req, "index.jade", "filename" -> filename, CONTENT -> content)
  }

  def index[A](req: HttpRequest[A])(file: AbstractDiskFile): ResponseFunction[org.jboss.netty.handler.codec.http.HttpResponse] = {
    index(req, file.name, new String(file.bytes))
  }

  def intent = Live(this).intent orElse {
    case req@POST(Path(Seg("save" :: _)) & Params(Content(content))) =>
      req.respond(CharContentType("application/octet-stream") ~> ResponseString(content))
//    case req@GET(Path(Seg("file" :: filename :: Nil))) => req.respond(index(req, filename))
    case req@GET(Path("/login")) =>
      req.respond(Redirect((url("https://github.com/login/oauth/authorize") <<?
			    Map(Github.CLIENT_ID -> Github.id) to_uri).toString))
    case req@GET(Path("/auth") & Params(Github.Code(code) & Github.State(state)) & Cookies(cookies)) =>
      client((url("https://github.com/login/oauth/access_token") <:<
	      Map("Accept" -> "application/json") <<
	      Map(Github.CLIENT_ID -> Github.id,
		  Github.CLIENT_SECRET -> Github.secret,
		  Github.CODE -> code,
		  Github.STATE -> state) as_str) ~>
	     (str => req.respond(str.parse(
	       json => (jObjectL andThen
			(JsonObject jsonObjectPL "access_token") andThen
			jStringL get json map (token =>
			  SetCookies(Cookie("token", token)) ~> Redirect("/"))) | ResponseString("error"),
	       _ => ResponseString("err"),
	       _ => ResponseString("fail")))))
    case req@GET(Path("/")) =>
      req.respond(index(req, "scratch"))
  }

  object Content extends Params.Extract(
    CONTENT,
    Params.first ~> Params.nonempty
  )

}

object Editor extends SafeApp {

  def client[A] = IO(new nio.Http).bracket[Unit, A](_.shutdown.point[IO])_

  def construct(port: Int)(editor: Editor) =
    IO(Http(port).resources(getClass.getResource("/public")).plan(editor))

  def editor[A](f: Editor => IO[A])(client: nio.Http) = IO(Editor(client)).bracket(_.template.shutdown.point[IO])(f)

  def server(port: Int) = Kleisli(editor(construct(port))_)

  override def runc = client(server(Properties.envOrElse("PORT", "8080").toInt) >==> (_.run.point[IO]))

}

case class Live(editor: Editor) extends async.Plan with ServerErrorResponse {

  val md5 = MessageDigest getInstance "MD5"

  def intent = {
    case req@POST(Path("/publish") & Cookies(cookies)) =>
      req.respond((cookies get "token") >| ResponseString("ok") getOrElse Redirect("/login"))
    case req@POST(Path("/live") & editor.Content(content)) =>
      editor.client(trigger("live", "listen", """{"content": """" + content + """"}""", None))
      req.respond(ResponseString("ok"))
  }

  def trigger(name: String, event: String, data: String, socket: Option[String]) = {
    val request = :/("api.pusherapp.com", 80) / "apps" / editor.Pusher.id / "channels" / name / "events"
    val query = Map("auth_key" -> editor.Pusher.key,
		    "auth_version" -> "1.0",
		    "auth_timestamp" -> (System.currentTimeMillis / 1000 shows),
		    "name" -> event,
		    "body_md5" -> (md5 digest data.getBytes map ("%02x".format(_)) mkString)) ++
                ~(socket map (s => Map("socket_id" -> s)))
    val signature = List("POST", request.path, query map (_ fold (_ + _)) mkString "=") mkString "\n"
    request <:<
    Map("Content-Type" -> "application/json") <<
    (query + ("auth_signature" -> signature)) as_str
  }

}
