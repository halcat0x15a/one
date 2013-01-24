(ns felis.test.edit
  (:refer-clojure :exclude [sequence next first rest conj empty])
  (:require [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.edit :refer :all]))

(defspec insert->delete
  (fn [edit char]
    (-> edit (insert char) delete))
  [^test/edit edit ^char char]
  (is (= % edit)))

(defspec append->backspace
  (fn [edit char]
    (-> edit (append char) backspace))
  [^test/edit edit ^char char]
  (is (= % edit)))

(defspec start-cursor=zero
  #(-> % start cursor)
  [^test/edit edit]
  (is (zero? %)))

(defspec end-cursor>=some-cursor
  #(-> % end cursor)
  [^test/edit edit]
  (is (>= % (cursor edit))))

(defspec next-cursor>=some-cursor
  #(-> % next cursor)
  [^test/edit edit]
  (is (>= % (cursor edit))))

(defspec prev-cursor<=some-cursor
  #(-> % prev cursor)
  [^test/edit edit]
  (is (<= % (cursor edit))))

(defspec still-when-delete
  #(-> % delete cursor)
  [^test/edit edit]
  (is (= % (cursor edit))))
