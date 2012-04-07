package onedit.client

import java.net.URL
import java.util.ResourceBundle

import javafx.fxml._
import javafx.event._
import javafx.scene.web._

class Root extends Initializable {

  @FXML private var web: WebView = _

  val statusChanged = new EventHandler[WebEvent[String]] {
    def handle(event: WebEvent[String]) {
      println(event.getData)
    }
  }

  def initialize(location: URL, resources: ResourceBundle) {
    web.getEngine.setOnStatusChanged(statusChanged)
    val url = resources.getString("url")
    println(url)
    web.getEngine.load(url)
//    web.getEngine.load("http://www.google.com")
  }

}
