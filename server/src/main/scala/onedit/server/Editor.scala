package onedit.server

import java.io.File

import org.fusesource.scalate.TemplateEngine
import org.fusesource.scalate.filter.ScalaMarkdownFilter
import org.fusesource.scalate.support.DummyRenderContext

import unfiltered.request._
import unfiltered.response._
import unfiltered.filter._
import unfiltered.jetty._
import unfiltered.scalate.Scalate
import unfiltered.util.{ Port, Browser }

import javafx.stage.Stage

import scalaz._
import Scalaz._

case class Editor(stage: Option[Stage]) extends Plan {

  val templates = Editor.resource("/templates").toURI

  implicit val engine = new TemplateEngine(new File(templates) :: Nil, "production")

  def intent = {
    case POST(Path("/open") & MultiPart(req)) => {
      MultiPartParams.Streamed(req).files("file") match {
        case Seq(file, _*) if !file.name.isEmpty => {
          ResponseString(file.stream(t => scala.io.Source.fromInputStream(t).mkString))
        }
      }
    }
    case POST(Path(Seg("save" :: _)) & Params(Content(content))) => {
      CharContentType("application/octet-stream") ~> ResponseString(content)
    }
    case POST(Path("/markdown") & Params(Content(content))) => {
      ResponseString(ScalaMarkdownFilter.filter(new DummyRenderContext("", engine, null), content))
    }
    case req@GET(Path("/")) => Scalate(req, "index.jade")
    case GET(Path("/test")) => ResponseString("geso")
  }

}

object Editor {

  lazy val resource = getClass.getResource _

  private def apply(stage: Option[Stage], port: Int): Server = Http.local(port).context("/public")(_.resources(resource("/public"))).filter(Editor(stage))

  def apply(port: Int): Server = Editor(None, port)

  def apply(stage: Stage, port: Int): Server = Editor(Some(stage), port)

  def main(args: Array[String]) {
    val server = Editor(Port.any)
    server.run(_ => Browser.open(server.url))
  }

}
