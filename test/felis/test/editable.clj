(ns felis.test.editable
  (:refer-clojure :exclude [next first rest conj empty])
  (:require [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.editable :refer :all]))

(defspec rest!=nil
  (fn [editable]
    (rest editable (test/field editable)))
  [^test/editable editable]
  (is (not (nil? %))))

(defspec insert->delete
  (fn [editable anything]
    (-> editable (insert anything) delete))
  [^test/editable editable ^char anything]
  (is (= % editable)))

(defspec append->backspace
  (fn [editable anything]
    (-> editable (append anything) backspace))
  [^test/editable editable ^char anything]
  (is (= % editable)))

(defspec start-position=zero
  #(-> % start position)
  [^test/editable editable]
  (is (zero? %)))

(defspec end-position>=some-position
  #(-> % end position)
  [^test/editable editable]
  (is (>= % (position editable))))

(defspec next-position>=some-position
  #(-> % next position)
  [^test/editable editable]
  (is (>= % (position editable))))

(defspec prev-position<=some-position
  #(-> % prev position)
  [^test/editable editable]
  (is (<= % (position editable))))

(defspec still-when-delete
  #(-> % delete position)
  [^test/editable editable]
  (is (= % (position editable))))
