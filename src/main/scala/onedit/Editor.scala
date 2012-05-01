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

case class Editor(server: String) extends async.Plan with ServerErrorResponse {

  val CONTENT = "content"

  val LANGUAGE = "language"

  val FILENAME = "filename"

  implicit val template = new TemplateEngine(new File(getClass.getResource("/templates").toURI) :: Nil, "production")

  val http = new nio.Http

  def highlight[T, R](req: HttpRequest[T] with Async.Responder[R], content: String, dispatcher: String, value: String) = {
    http(:/(server) / "highlight" / dispatcher / value << Map(CONTENT -> content) >- (rep => req.respond(ResponseString(rep))))
  }

  def intent = {
    case req@GET(Path("/lexers")) => {
      http(:/(server) / "lexers" >- (rep => req.respond(JsonContent ~> ResponseString(rep))))
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
