package onedit

import scala.util.Properties

object Main extends App {
  val port = Properties.envOrElse("PORT", "8080").toInt
  println("Starting on port:" + port)
  Editor("onedit-py.herokuapp.com")(port).run()
}
