(defproject one "0.1-SNAPSHOT"
  :description "online text editor"
  :url "http://github.com/halcat0x15a/one"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/core.match "0.2.0-alpha11"]
                 [org.clojure/test.generative "0.1.9"]]
  :plugins [[lein-cljsbuild "0.2.7"]]
;  :hooks [leiningen.cljsbuild]
  :cljsbuild {:crossovers [one.core]
              :crossover-jar true
              :builds {:main
                       {:compiler {:output-to "server/src/main/resources/public/one.js"
                                   :optimizations :advanced}}
                       :debug
                       {:compiler {:output-to "server/target/scala-2.9.2/classes/public/one.js"
                                   :pretty-print true}}}})
