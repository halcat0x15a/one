(ns felis.test.string
  (:refer-clojure :exclude [rest butlast])
  (:require [clojure.data.generators :as gen]
            [clojure.test.generative :refer :all]
            [felis.test :as test]
            [felis.string :refer :all]))

(defspec not_empty_split-lines_string
  split-lines
  [^string string]
  (is (not (empty? %))))

(defspec not_nil_rest_string
  rest
  [^string string]
  (is (not (nil? %))))

(defspec not_nil_butlast_string
  butlast
  [^string string]
  (is (not (nil? %))))

(defspec not_contains_set_nbsp_string
  (comp set nbsp)
  [^string string]
  (is (not (contains? % \space))))
