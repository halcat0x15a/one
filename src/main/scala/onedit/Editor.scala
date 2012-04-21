package onedit

import java.io.{ File, InputStreamReader }

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

object Editor extends cycle.Plan with cycle.ThreadPool with ServerErrorResponse {

  lazy val resource = getClass.getResource _

  implicit val template = new TemplateEngine(new File(resource("/templates").toURI) :: Nil, "production")

  val highlight = Source.fromURL(resource("/highlight.py")).mkString

  def py = (new ScriptEngineManager).getEngineByName("python")

  val lexers = {
    val engine = py
    engine.eval(new InputStreamReader(resource("/lexers.py").openStream))
    engine.get("result").toString
  }

  def apply(port: Int) = Http(port).resources(resource("/public")).plan(this)

  def intent = {
    case GET(Path("/lexers")) => {
      JsonContent ~> ResponseString(lexers)
    }
    case POST(Path(Seg("save" :: _)) & Params(Content(content))) => {
      CharContentType("application/octet-stream") ~> ResponseString(content)
    }
    case POST(Path("/markdown") & Params(Content(content))) => {
      ResponseString(ScalaMarkdownFilter.filter(new DummyRenderContext("", template, null), content))
    }
    case POST(Path("/highlight") & Params(Content(content) & Language(lang))) => {
      val engine = py
      val bindings = engine.getBindings(ScriptContext.ENGINE_SCOPE)
      bindings.put("code", content)
      bindings.put("lang", lang)
      engine.eval(highlight)
      ResponseString(engine.get("result").toString)
    }
    case req@GET(Path("/")) => Scalate(req, "index.jade")
    case GET(Path("/test")) => ResponseString("geso")
  }

  object Content extends Params.Extract(
    "content",
    Params.first ~> Params.nonempty
  )

  object Language extends Params.Extract(
    "language",
    Params.first ~> Params.nonempty
  )

}
