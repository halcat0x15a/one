(defproject one "0.1-SNAPSHOT"
  :description "online text editor"
  :url "http://github.com/halcat0x15a/one"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/test.generative "0.1.9"]
                 [org.clojure/core.incubator "0.1.2"]]
  :plugins [[lein-cljsbuild "0.2.7"]]
  :cljsbuild {
              :builds {
                       :main
                       {
                        :compiler {
                                   :output-to "server/src/main/resources/public/one.js"
                                   :optimizations :advanced}}
                       :debug
                       {
                        :compiler {
                                   :output-to "server/target/scala-2.9.2/classes/public/one.js"
                                   :pretty-print true}}}})
