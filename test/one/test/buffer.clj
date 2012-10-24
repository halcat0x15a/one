(comment
(ns one.test.cursor
  (:require [one.test :as test]
            [one.core.record :as record]
            [one.core.lens :as lens]
            [one.core.util :as util]
            [one.core.buffer :as buffer])
  (:use [clojure.test :only [is are]]
        [clojure.test.generative :only [defspec]]
        [one.core.lens :only [lens-set lens-get]]))
)