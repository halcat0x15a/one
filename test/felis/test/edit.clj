(ns felis.test.edit
  (:require [clojure.test.generative :refer :all]
            [clojure.data.generators :as gen]
            [felis.test :as test]
            [felis.default :as default]
            [felis.edit :refer :all]))

(defspec opposite-opposite
  (comp opposite opposite)
  [^test/field field]
  (is (= % field)))

(defspec insert-move-move-delete
  (fn [edit field]
    (-> edit
        (insert field (test/element edit))
        (move field)
        (move (opposite field))
        (delete field)))
  [^test/edit edit ^test/field field]
  (is (= % edit)))

(defspec default-move
  (fn [edit field]
    (-> edit type default/default (move field)))
  [^test/edit edit ^test/field field]
  (is (default/default? %)))

(defspec default-delete
  (fn [edit field]
    (-> edit type default/default (delete field)))
  [^test/edit edit ^test/field field]
  (is (default/default? %)))
