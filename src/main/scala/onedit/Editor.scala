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

  implicit val template = new TemplateEngine(new File(getClass.getResource("/templates").toURI) :: Nil, "production")

  val http = new nio.Http

  def intent = {
    case req@Path("/geso") => req.respond(ResponseString("geso"))
    case req@POST(Path(Seg("save" :: _)) & Params(Content(content))) => {
      req.respond(CharContentType("application/octet-stream") ~> ResponseString(content))
    }
    case req@GET(Path(Seg("new" :: filename :: Nil))) => req.respond(Scalate(req, "index.jade", "filename" -> filename))
    case req@GET(Path("/")) => req.respond(Scalate(req, "index.jade", "filename" -> "scratch"))
  }

  object Content extends Params.Extract(
    CONTENT,
    Params.first ~> Params.nonempty
  )

}
