(ns felis.test.editable
  (:require [clojure.data.generators :as gen]
            [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.editable :refer :all]
            [felis.core :as core]))

(defspec string->editable->string
  (fn [string edit]
    (->> string (string-> edit) core/text))
  [^string string ^test/edit edit]
  (is (= % string)))

(defspec editable->string->editable
  (fn [editable]
    (->> editable core/text (string-> (edit editable))))
  [^{:tag (test/editable test/initial)} editable]
  (is (= % editable)))
