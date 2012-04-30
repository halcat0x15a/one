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
      scalaVersion := "2.9.2",
      resolvers ++= Seq(
        "java" at "http://download.java.net/maven/2",
	"typesafe releases" at "http://repo.typesafe.com/typesafe/releases/",
	"typesafe snapshots" at "http://repo.typesafe.com/typesafe/snapshots/"
      ),
      libraryDependencies ++= Seq(
        "org.scalaz" %% "scalaz-core" % "7.0-SNAPSHOT",
	"org.scala-tools" %% "scala-stm" % "0.5",
        "net.databinder" %% "unfiltered-netty-websockets" % "0.6.1",
	"net.databinder" %% "unfiltered-json" % "0.6.1",
	"net.databinder" %% "dispatch-nio" % "0.8.8",
        "org.fusesource.scalamd" % "scalamd" % "1.5",
        "org.slf4j" % "slf4j-nop" % "1.6.4",
        "javax.servlet" % "servlet-api" % "2.5"
      ),
      scalacOptions += "-unchecked"
    )
  ) dependsOn uri("git://github.com/unfiltered/unfiltered-scalate.git")

}
