package onedit.client

import java.io.File
import java.nio.file.Paths

import javafx.application.Application
import javafx.stage.Stage
import javafx.scene.Scene
import javafx.scene.web._

import scalaz._, Scalaz._
import scalaz.effect._, IO._

import com.twitter.util.Eval

import unfiltered.netty.Http
import unfiltered.util.Port

class Editor extends Application {

  def start(stage: Stage) {
    val web = new WebView
    val engine = web.getEngine
    val url = getParameters.getUnnamed get 0
    engine.load(url)
    val scene = new Scene(web)
    stage.setScene(scene)
    stage.show
  }

}

object Editor extends SafeApp {

  val SettingsFile = ".onedit.scala"

  import onedit.server.Editor._

  lazy val settings = (for {
    home <- sys.props get "user.home"
    file = Paths.get(home, SettingsFile).toFile
    if file.exists
    eval = new Eval
  } yield eval[Settings](file)) | Settings

  def port = settings.port | Port.any

  lazy val launch: String => Unit = Application.launch(classOf[Editor], _)

  lazy val run: Http => IO[Unit] =
    _.start.point[IO].bracket(_.stop.destroy.point[IO])(_.url |> launch >>> (_.point[IO]))

  override def runc = client(server(port) >>> run)

}
