(ns felis.test.editor
  (:require [clojure.test :refer :all]
            [felis.test :as test]
            [felis.collection.string :as string]
            [felis.editor :as editor]
            [felis.editor.vim :refer :all]))

(deftest helloworld
  (testing "type 'hello world'"
    (is (= (editor/emulate vim \i "helloworld" :escape)
           (assoc-in vim [:buffer :row :lefts] (string/->Left "helloworld"))))))
