(ns onedit.graphics
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom.DomHelper :as dom-helper]
            [onedit.core :as core]
            [onedit.style :as style]
            [onedit.util :as util]
            [onedit.parser :as parser]
            [onedit.syntax :as syntax]))

(defn text-width [s g]
  (-> g (.measureText s) .-width))

(defn render [editor canvas]
  (let [g (.getContext canvas "2d")
        {:keys [x y]} (core/get-cursor editor)
        strings (core/get-strings editor)
        string (util/join-newline strings)]
    (set! (.-fillStyle g) style/text-color)
    (set! (.-font g) (str style/font-size "px " style/font-family))
    (.clearRect g 0 0 1024 1024)
    (dotimes [n (count strings)]
      (.fillText g (strings n) 0 (* (inc n) style/font-size)))
    (.fillText g style/pointer (text-width (subs (strings y) 0 x) g) (* (inc y) style/font-size))
    (doseq [[k c] (:table (parser/parse syntax/clojure string))]
      (doseq [[a b] c]
        (set! (.-fillStyle g) (k style/highlight))
        (let [substrings (string/split-lines (subs string 0 a))]
          (.fillText g (subs string a b) (text-width (last substrings) g) (* (count substrings) style/font-size)))))))
