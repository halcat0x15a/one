(ns felis.test.editable
  (:refer-clojure :exclude [sequence next first rest conj empty])
  (:require [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.editable :refer :all]))

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

(defspec start-cursor=zero
  #(-> % start cursor)
  [^test/editable editable]
  (is (zero? %)))

(defspec end-cursor>=some-cursor
  #(-> % end cursor)
  [^test/editable editable]
  (is (>= % (cursor editable))))

(defspec next-cursor>=some-cursor
  #(-> % next cursor)
  [^test/editable editable]
  (is (>= % (cursor editable))))

(defspec prev-cursor<=some-cursor
  #(-> % prev cursor)
  [^test/editable editable]
  (is (<= % (cursor editable))))

(defspec still-when-delete
  #(-> % delete cursor)
  [^test/editable editable]
  (is (= % (cursor editable))))
