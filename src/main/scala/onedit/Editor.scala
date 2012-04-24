package onedit

import java.io.File

import org.fusesource.scalate.TemplateEngine
import org.fusesource.scalamd.Markdown

import unfiltered.request._
import unfiltered.response._
import unfiltered.netty._
import unfiltered.scalate.Scalate

import dispatch._

import scalaz._
import Scalaz._

case class Editor(py: String) extends async.Plan with ServerErrorResponse {

  lazy val resource = getClass.getResource _

  implicit val template = new TemplateEngine(new File(resource("/templates").toURI) :: Nil, "production")

  val http = new nio.Http

  def apply(port: Int) = Http(port).resources(resource("/public")).plan(this)

  def intent = {
    case req@GET(Path("/lexers")) => {
      http(:/(py) / "lexers" >- (rep => req.respond(JsonContent ~> ResponseString(rep))))
    }
    case req@POST(Path(Seg("save" :: _)) & Params(Content(content))) => {
      req.respond(CharContentType("application/octet-stream") ~> ResponseString(content))
    }
    case req@POST(Path("/markdown") & Params(Content(content))) => {
      req.respond(ResponseString(Markdown(content)))
    }
    case req@POST(Path("/highlight") & Params(Content(content) & Language(lang))) => {
      http(:/(py) / "highlight" << Map("content" -> content, "lang" -> lang) >- (rep => req.respond(ResponseString(rep))))
    }
    case req@GET(Path("/")) => req.respond(Scalate(req, "index.jade"))
  }

  object Content extends Params.Extract(
    "content",
    Params.first ~> Params.nonempty
  )

  object Language extends Params.Extract(
    "lang",
    Params.first ~> Params.nonempty
  )

}
