package onedit

import scala.util.Properties

object Main extends App {
  assert(args.nonEmpty)
  val port = Properties.envOrElse("PORT", "8080").toInt
  println("Starting on port:" + port)
  val editor = Editor(args.last)
  editor(port).run()
  editor.http.shutdown()
}
