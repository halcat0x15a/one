(ns one.core.data
  (:require [one.core.lens :as lens])
  (:use;*CLJSBUILD-REMOVE*;-macros
   [one.core.macros :only [defdata]]))

(defdata Editor [buffers current])

(def buffer
  (reify lens/Lens
    (get [this editor]
      ((:current editor) (:buffers editor)))
    (set [this buffer editor]
      (lens/modify buffers
                   #(assoc %
                      (:current editor) buffer)
                   editor))))

(defdata Buffer [text cursor] buffer)

(defdata Cursor [x y] cursor)

(def line
  (reify lens/Lens
    (get [this editor]
      (get (lens/get text editor) (lens/get y editor)))
    (set [this editor line]
      (lens/modify text
                   (fn [text]
                     (assoc text
                       (lens/get y editor) line))
                   editor))))

;(defdata Mode [name function] mode)
