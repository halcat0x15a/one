package onedit.client

import javafx.stage.Stage
import javafx.fxml.FXMLLoader
import javafx.scene.Scene
import javafx.scene.layout.BorderPane

import scala.actors.Actor._

import onedit.server.Editor

class Application extends javafx.application.Application {

  lazy val (server, url) = Editor.local()

  lazy val root: BorderPane = FXMLLoader.load(getClass.getResource("/root.fxml"), Resource(url))

  def start(stage: Stage) {
    actor(server.run())
    stage.setTitle("onedit")
    stage.setScene(new Scene(root))
    stage.show()
  }

}

object Application {

  def main(args: Array[String]) {
    javafx.application.Application.launch(classOf[Application], args: _*)
  }

}
