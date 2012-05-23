package onedit

import java.io.File

import org.fusesource.scalate.TemplateEngine
import org.fusesource.scalamd.Markdown

import unfiltered.Async
import unfiltered.request._
import unfiltered.response._
import unfiltered.netty._
import unfiltered.scalate.Scalate
import unfiltered.netty.request._

import dispatch._

import scalaz._
import Scalaz._

case class Editor(server: String) extends async.Plan with ServerErrorResponse {

  val CONTENT = "content"

  implicit val template = new TemplateEngine(new File(getClass.getResource("/templates").toURI) :: Nil, "production")

  val http = new nio.Http

  def index[A](req: HttpRequest[A], filename: String, content: String = "") = {
    Scalate(req, "index.jade", "filename" -> filename, CONTENT -> content)
  }

  def index[A](req: HttpRequest[A])(file: AbstractDiskFile): ResponseWriter = {
    index(req, file.name, new String(file.bytes))
  }

  def decoder = async.MultiPartDecoder({
    case POST(Path("/open") & MultiPart(req)) => {
      case Decode(binding) => {
	req.respond(MultiPartParams.Disk(binding).files("file").headOption.map(index(req)) | ResponseString(""))
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
