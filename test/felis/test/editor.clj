(ns felis.test.editor
  (:require [clojure.test :refer :all]
            [felis.test :as test]
            [felis.collection.string :as string]
            [felis.editor :as editor]))

(defprotocol Input
  (input [this editor]))

(extend-protocol Input
  java.lang.String
  (input [this editor]
    (if-let [char (first this)]
      (->> editor
           (input char)
           (input (subs this 1)))
      editor))
  java.lang.Character
  (input [this editor]
    (editor/run editor test/keymap this))
  clojure.lang.Keyword
  (input [this editor]
    (editor/run editor test/keymap this)))

(defn emulate [x & xs]
  (reduce (fn [editor x] (input x editor)) editor/default (cons x xs)))

(deftest helloworld
  (testing "type 'hello world'"
    (is (= (emulate \i "helloworld" :escape)
           (assoc-in editor/default [:buffer :row :lefts] (string/->Left "helloworld"))))))
