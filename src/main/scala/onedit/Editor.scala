package onedit

import java.io.File

import org.fusesource.scalate.TemplateEngine
import org.fusesource.scalate.filter.ScalaMarkdownFilter
import org.fusesource.scalate.support.DummyRenderContext

import unfiltered.request._
import unfiltered.response._
import unfiltered.netty._
import unfiltered.scalate.Scalate
import unfiltered.util.{ Port, Browser }

import javax.script._

import scala.io.Source

import scalaz._
import Scalaz._

class Editor extends cycle.Plan with cycle.ThreadPool with ServerErrorResponse {

  val templates = Editor.resource("/templates").toURI

  implicit val engine = new TemplateEngine(new File(templates) :: Nil, "production")

  val script = (new ScriptEngineManager).getEngineByName("python")

  val highlight = Source.fromURL(Editor.resource("/highlight.py")).mkString

  def intent = {
    case POST(Path("/open") & MultiPart(req)) => {
      MultiPartParams.Streamed(req).files("file") match {
        case Seq(file, _*) if !file.name.isEmpty => {
          ResponseString(file.stream(t => Source.fromInputStream(t).mkString))
        }
      }
    }
    case POST(Path(Seg("save" :: _)) & Params(Content(content))) => {
      CharContentType("application/octet-stream") ~> ResponseString(content)
    }
    case POST(Path("/markdown") & Params(Content(content))) => {
      ResponseString(ScalaMarkdownFilter.filter(new DummyRenderContext("", engine, null), content))
    }
    case GET(Path("/highlight")) => {
      script.eval(highlight)
      ResponseString(script.get("result").toString)
    }
    case req@GET(Path("/")) => Scalate(req, "index.jade")
    case GET(Path("/test")) => ResponseString("geso")
  }

}

object Editor {

  lazy val resource = getClass.getResource _

  def apply(port: Int) = Http(port).resources(resource("/public")).plan(new Editor)

}
