package onedit.client

import java.net.URL
import java.util.ResourceBundle

import javafx.fxml._
import javafx.scene.web.WebView

class Root extends Initializable {

  @FXML private var web: WebView = _

  def initialize(location: URL, resources: ResourceBundle) {
    val url = resources.getString("url")
    println(url)
    web.getEngine.load(url)
  }

}
