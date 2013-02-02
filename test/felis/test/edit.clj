(ns felis.test.edit
  (:require [clojure.test.generative :refer :all]
            [clojure.data.generators :as gen]
            [felis.test :as test]
            [felis.edit :refer :all]))

(defspec opposite_f->opposite_f=f
  (comp opposite opposite)
  [^test/field field]
  (is (= % field)))

(defspec insert_e_x->move_e->move_opposite_e->delete_e=e
  (fn [edit field]
    (-> edit
        (insert field (test/element edit))
        (move field)
        (move (opposite field))
        (delete field)))
  [^test/edit edit ^test/field field]
  (is (= % edit)))
