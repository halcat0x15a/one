package onedit

import scala.util.Properties

import unfiltered.netty._

object Main extends App {
  assert(args.nonEmpty)
  val port = Properties.envOrElse("PORT", "8080").toInt
  println("Starting on port:" + port)
  val editor = Editor(args.last)
  Http(port).plan(LiveCoding).resources(getClass.getResource("/public")).plan(editor).handler(editor.decoder).run()
  editor.http.shutdown()
}
