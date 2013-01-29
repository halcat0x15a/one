(ns felis.test.canvas
  (:require [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.string :as string]
            [felis.serialization :as serialization]
            [felis.canvas :refer :all]))

(def canvas
  (reify Canvas
    (color [canvas color])
    (text [canvas string x y]
      (println string))))
(comment
(defspec string-drawn=buffer-serialized
  #(->> % (draw canvas) with-out-str string/butlast)
  [^test/editor editor]
  (is (= % (-> editor :buffer serialization/write))))
)
