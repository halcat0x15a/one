(ns felis.test.editor
  (:require [clojure.test :refer :all]
            [felis.test :as test]
            [felis.editor :as editor]))

(def emulate
  (partial reduce (partial editor/run test/keymap) editor/default))

(deftest helloworld
  (testing "type 'hello world'"))
