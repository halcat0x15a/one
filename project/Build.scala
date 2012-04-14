import sbt._
import Keys._
import com.typesafe.startscript.StartScriptPlugin._

object EditorBuild extends Build {

  lazy val root = Project(
    id = "onedit",
    base = file("."),
    settings = Defaults.defaultSettings ++ startScriptForClassesSettings ++ Seq(
      organization := "baskingcat",
      version      := "0.1-SNAPSHOT",
      scalaVersion := "2.9.1",
      resolvers += ScalaToolsSnapshots,
      libraryDependencies ++= Seq(
	"org.scalaz" %% "scalaz-core" % "7.0-SNAPSHOT",
	"net.databinder" %% "unfiltered-filter" % "0.6.1",
	"net.databinder" %% "unfiltered-jetty" % "0.6.1",
	"net.databinder" %% "unfiltered-uploads" % "0.6.1",
	"org.fusesource.scalate" % "scalate-jruby" % "1.5.3",
	"org.fusesource.scalamd" % "scalamd" % "1.5",
	"org.python" % "jython-standalone" % "2.5.2",
	"org.slf4j" % "slf4j-nop" % "1.6.4"
      )
  )
  ) dependsOn uri("git://github.com/unfiltered/unfiltered-scalate")

}
