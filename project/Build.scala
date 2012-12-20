import sbt._
import Keys._
import com.typesafe.startscript.StartScriptPlugin._

object OneBuild extends Build {

  val scalazVersion = "7.0.0-M3"
  val unfilteredVersion = "0.6.+"
  val dispatchVersion = "0.8.9"

  val javafx = file("/usr/lib/jvm/javafx-sdk/rt/lib")
  val jfxrt = javafx / "jfxrt.jar"
  val native = javafx / "i386"

  val defaultSettings = Defaults.defaultSettings ++ Seq(
    organization := "baskingcat",
    version      := "0.1-SNAPSHOT",
    scalaVersion := "2.9.2",
    resolvers ++= Seq(
      "java" at "http://download.java.net/maven/2",
      "typesafe releases" at "http://repo.typesafe.com/typesafe/releases/",
      "typesafe snapshots" at "http://repo.typesafe.com/typesafe/snapshots/",
      "mth.io releases"  at "http://repo.mth.io/releases",
      "fusesource" at "http://repo.fusesource.com/nexus/content/repositories/snapshots"
    ),
    libraryDependencies ++= Seq(
      "org.scalaz" %% "scalaz-core" % scalazVersion,
      "org.scalaz" %% "scalaz-effect" % scalazVersion,
      "com.typesafe" % "config" % "0.5.0"
    ),
    scalacOptions ++= Seq(
      "-unchecked",
      "-deprecation"
    )
  )

  lazy val root = Project(
    id = "one",
    base = file(".")
  ) aggregate (server, client)

  lazy val server = Project(
    id = "server",
    base = file("server"),
    settings = defaultSettings ++ startScriptForClassesSettings ++ Seq(
      libraryDependencies ++= Seq(
	"com.ephox" %% "argonaut" % "4.0" withSources,
        "net.databinder" %% "unfiltered-netty-websockets" % unfilteredVersion,
        "net.databinder" %% "unfiltered-netty-uploads" % unfilteredVersion,
	"net.databinder" %% "dispatch-nio" % dispatchVersion,
	"net.databinder" %% "dispatch-http-json" % dispatchVersion,
        "org.slf4j" % "slf4j-nop" % "1.6.+",
        "javax.servlet" % "servlet-api" % "2.5"
      )
    )
  ) dependsOn uri("git://github.com/halcat0x15a/unfiltered-scalate.git")

  lazy val client = Project(
    id = "client",
    base = file("client"),
    settings = defaultSettings ++ Seq(
      libraryDependencies ++= Seq(
	"com.twitter" % "util-eval" % "5.+"
      ),
      unmanagedClasspath in Runtime += native
    ) ++ (Seq(Compile, Runtime) map (externalDependencyClasspath in _ += jfxrt))
  ) dependsOn server

}
