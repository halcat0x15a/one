(ns felis.test.editor
  (:require [clojure.data.generators :as gen]
            [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.editable :refer :all]))

(defspec right-left
  (fn [editor edit]
    (->> editor (start edit) (right edit) (left edit)))
  [^{:tag (test/editor test/default)} editor  ^test/edit edit]
  (is (= % (start edit editor))))

(defspec left-right
  (fn [editor edit]
    (->> editor (end edit) (left edit) (right edit)))
  [^{:tag (test/editor test/default)} editor ^test/edit edit]
  (is (= % (end edit editor))))

(defspec insert-delete
  (fn [editor edit]
    (->> editor (insert edit) (delete edit)))
  [^{:tag (test/editor test/default)} editor ^test/edit edit]
  (is (= % editor)))

(defspec append-backspace
  (fn [editor edit]
    (->> editor (append edit) (backspace edit)))
  [^{:tag (test/editor test/default)} editor ^test/edit edit]
  (is (= % editor)))

(defspec delete-lefts-rights-initialize
  (fn [editor edit]
    (->> editor (delete-lefts edit) (delete-rights edit)))
  [^{:tag (test/editor test/default)} editor ^test/edit edit]
  (is (= % (initialize edit editor))))
