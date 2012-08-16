(defproject onedit "0.1-SNAPSHOT"
  :description "online editor"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/core.logic "0.7.5"]
                 [org.clojure/core.match "0.2.0-alpha10"]]
  :plugins [[lein-cljsbuild "0.2.5"]]
  :cljsbuild {
              :builds {
                       :main
                       {
                        :compiler {
                                   :output-to "server/src/main/resources/public/onedit.js"
                                   :optimizations :advanced}}
                       :debug
                       {
                        :compiler {
                                   :output-to "server/target/scala-2.9.2/classes/public/onedit.js"
                                   :pretty-print true}}}})
