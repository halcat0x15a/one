package onedit

import java.io.File

import org.fusesource.scalate.TemplateEngine
import org.fusesource.scalamd.Markdown

import unfiltered.Async
import unfiltered.request._
import unfiltered.response._
import unfiltered.netty._
import unfiltered.scalate.Scalate

import dispatch._

import scalaz._
import Scalaz._

import scala.concurrent.stm._

case class Editor(py: String) extends async.Plan with ServerErrorResponse {

  val CONTENT = "content"

  val LANGUAGE = "language"

  val FILENAME = "filename"

  lazy val resource = getClass.getResource _

  implicit val template = new TemplateEngine(new File(resource("/templates").toURI) :: Nil, "production")

  val http = new nio.Http

  def apply(port: Int) = Http(port).resources(resource("/public")).plan(this)

  def highlight[T, R](req: HttpRequest[T] with Async.Responder[R], content: String, dispatcher: String, value: String) = {
    http(:/(py) / "highlight" / dispatcher / value << Map(CONTENT -> content) >- (rep => req.respond(ResponseString(rep))))
  }

  val counter = Ref(0L)

  def intent = {
    case req@GET(Path("/unique")) => {
      val id = counter.single()
      atomic { implicit t => 
	counter += 1
      }
      req.respond(JsonContent ~> ResponseString("""{"id":""" |+| id.shows |+| "}"))
    }
    case req@GET(Path("/lexers")) => {
      http(:/(py) / "lexers" >- (rep => req.respond(JsonContent ~> ResponseString(rep))))
    }
    case req@POST(Path(Seg("save" :: _)) & Params(Content(content))) => {
      req.respond(CharContentType("application/octet-stream") ~> ResponseString(content))
    }
    case req@POST(Path("/markdown") & Params(Content(content))) => {
      req.respond(ResponseString(Markdown(content)))
    }
    case req@POST(Path(Seg("highlight" :: FILENAME :: name :: Nil)) & Params(Content(content))) => {
      highlight(req, content, FILENAME, name)
    }
    case req@POST(Path(Seg("highlight" :: LANGUAGE :: lang :: Nil)) & Params(Content(content))) => {
      highlight(req, content, LANGUAGE, lang)
    }
    case req@GET(Path("/")) => req.respond(Scalate(req, "index.jade"))
  }

  object Content extends Params.Extract(
    CONTENT,
    Params.first ~> Params.nonempty
  )

  object Language extends Params.Extract(
    LANGUAGE,
    Params.first ~> Params.nonempty
  )

  object Filename extends Params.Extract(
    FILENAME,
    Params.first ~> Params.nonempty
  )

}
