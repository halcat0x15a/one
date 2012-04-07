package onedit.client

import javafx.stage.Stage
import javafx.fxml.FXMLLoader
import javafx.scene.Scene
import javafx.scene.layout.BorderPane

import scala.actors.Actor._

import onedit.server.Editor

class Application extends javafx.application.Application {

  def start(stage: Stage) {
    val server = Editor(stage, 3460)
    actor(server.run())
    stage.setTitle("onedit")
    stage.setScene(new Scene(FXMLLoader.load(getClass.getResource("/root.fxml"), Resource(server.url))))
    stage.show()
  }

}

object Application {

  def main(args: Array[String]) {
    javafx.application.Application.launch(classOf[Application], args: _*)
  }

}
