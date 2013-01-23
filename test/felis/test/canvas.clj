(ns felis.test.canvas
  (:require [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.string :as string]
            [felis.serialization :as serialization]
            [felis.canvas :refer :all]))

(def canvas
  (reify Canvas
    (text [this string x y]
      (println string))))

(defspec string-drawn=buffer-serialized
  #(->> % (draw canvas) with-out-str string/butlast)
  [^test/editor editor]
  (is (= % (-> editor :buffer serialization/write))))
