(defproject onedit "0.1-SNAPSHOT"
  :description "online editor"
  :dependencies [[org.clojure/clojure "1.3.0"]]
  :plugins [[lein-cljsbuild "0.1.7"]]
  :cljsbuild {
              :builds [{
                        :source-path "src/main/cljs"
                        :compiler {
                                   :output-to "src/main/resources/public/onedit.js"
                                   :pretty-print true}}]})
