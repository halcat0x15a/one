package onedit.server

import java.io.File

import scala.util.Properties

import org.fusesource.scalate.TemplateEngine

import unfiltered.netty._
import unfiltered.request._
import unfiltered.response._

import unfiltered.scalate.Scalate

import unfiltered.netty.request._

import dispatch._

import scalaz._, Scalaz._
import effect._

case class Editor(client: nio.Http) extends async.Plan with ServerErrorResponse {

  val CONTENT = "content"

  implicit val template = TemplateEngine(new File(getClass.getResource("/templates").toURI) :: Nil, "production")

  def index[A](req: HttpRequest[A], filename: String, content: String = "") = {
    HtmlContent ~> Scalate(req, "index.jade", "filename" -> filename, CONTENT -> content)
  }

  def index[A](req: HttpRequest[A])(file: AbstractDiskFile): ResponseFunction[org.jboss.netty.handler.codec.http.HttpResponse] = {
    index(req, file.name, new String(file.bytes))
  }

  def decoder = async.MultiPartDecoder({
    case POST(Path("/open") & MultiPart(req)) => {
      case Decode(binding) => {
	req.respond(MultiPartParams.Disk(binding).files("file").headOption.map(index(req)) | HtmlContent ~> ResponseString(""))
      }
    }
  })

  def intent = {
    case req@POST(Path(Seg("save" :: _)) & Params(Content(content))) => {
      req.respond(CharContentType("application/octet-stream") ~> ResponseString(content))
    }
    case req@GET(Path(Seg("file" :: filename :: Nil))) => {
      req.respond(index(req, filename))
    }
    case req@GET(Path("/")) => {
      req.respond(index(req, "scratch"))
    }
  }

  object Content extends Params.Extract(
    CONTENT,
    Params.first ~> Params.nonempty
  )

}

object Editor extends SafeApp {

  def client[A] = IO(new nio.Http).bracket[Unit, A](_.shutdown.point[IO])_

  def construct(port: Int)(editor: Editor) =
    IO(Http(port).plan(LiveCoding).resources(getClass.getResource("/public")).plan(editor).handler(editor.decoder))

  def editor[A](f: Editor => IO[A])(client: nio.Http) = IO(Editor(client)).bracket(_.template.shutdown.point[IO])(f)

  def server(port: Int) = Kleisli(editor(construct(port))_)

  override def runc = client(server(Properties.envOrElse("PORT", "8080").toInt) >==> (_.run.point[IO]))

}
