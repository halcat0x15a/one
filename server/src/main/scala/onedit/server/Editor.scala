package onedit.server

import java.io.File

import org.fusesource.scalate.TemplateEngine

import unfiltered.request._
import unfiltered.response._
import unfiltered.filter._
import unfiltered.jetty._
import unfiltered.scalate.Scalate

import scalaz._
import Scalaz._

class Editor extends Plan {

  val templates = Editor.resource("/templates").toURI

  implicit val engine = new TemplateEngine(new File(templates) :: Nil, "production")

  def intent = {
    case POST(Path("/quit")) => ResponseString("hoge")
    case req@GET(Path("/")) => Ok ~> Scalate(req, "index.jade")
    case GET(Path("/test")) => Ok ~> ResponseString("geso")
  }

}

object Editor {

  lazy val resource = getClass.getResource _

  def local(port: Int = 3460) = {
    val http = Http(port)
    (http.context("/public")(_.resources(resource("/public"))).filter(new Editor), http.url)
  }

  def main(args: Array[String]) {
    local().fold((server, url) => server.run(_ => unfiltered.util.Browser.open(url)))
  }

}
