(ns felis.test.editable
  (:refer-clojure :exclude [next first rest conj empty])
  (:require [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.editable :refer :all]))

(defspec non-nil
  (fn [editable]
    (rest editable (test/field editable)))
  [^test/editable editable]
  (is (not (nil? %))))

(defspec next-prev
  #(-> % start next prev)
  [^test/editable editable]
  (is (= % (start editable))))

(defspec prev-next
  #(-> % end prev next)
  [^test/editable editable]
  (is (= % (end editable))))

(defspec insert-delete
  (fn [editable anything]
    (-> editable (insert anything) delete))
  [^test/editable editable ^char anything]
  (is (= % editable)))

(defspec append-backspace
  (fn [editable anything]
    (-> editable (append anything) backspace))
  [^test/editable editable ^char anything]
  (is (= % editable)))
