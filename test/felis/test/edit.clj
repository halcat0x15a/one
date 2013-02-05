(ns felis.test.edit
  (:require [clojure.test.generative :refer :all]
            [clojure.data.generators :as gen]
            [felis.test :as test]
            [felis.empty :as empty]
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
  [^test/edit edit ^test/field _]
  (is (= % edit)))

(defspec empty-move
  (fn [edit field]
    (-> edit type empty/empty (move field)))
  [^test/edit edit ^test/field _]
  (is (empty/empty? %)))

(defspec empty-delete
  (fn [edit field]
    (-> edit type empty/empty (delete field)))
  [^test/edit edit ^test/field _]
  (is (empty/empty? %)))
