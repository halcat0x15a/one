(defproject onedit "0.1-SNAPSHOT"
  :description "online editor"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/core.logic "0.7.5"]]
  :plugins [[lein-cljsbuild "0.2.5"]]
  :cljsbuild {
              :builds [{
                        :source-path "src/main/cljs"
                        :compiler {
                                   :output-to "src/main/resources/public/onedit.js"
                                   :pretty-print true}}]})
