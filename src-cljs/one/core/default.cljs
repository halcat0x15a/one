(ns one.core.default
  (:require [one.core.record :as record]
            [one.core.text :as text]))

(def cursor (record/->Cursor 0 0 0))

(def mode-name :fundamental)

(defn mode-function [editor key]
  (text/insert (name key) editor))

(def mode (record/->Mode mode-name mode-function))

(def buffer (record/->Buffer [""] cursor mode))

(defn view [width height]
  (record/->View 0 0 width height))

(def minibuffer (record/->Minibuffer "" cursor))

(def history (record/->History "" (list) 0))
