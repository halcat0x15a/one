(ns onedit.tab
  (:require [onedit.core :as core]
            [goog.object :as object]
            [goog.dom :as dom]
            [goog.events :as events]))

(def get-tab #(core/jquery ".nav-tabs .active a"))

(defn data
  ([key] (.data (get-tab) key))
  ([key value] (.data (get-tab) key value)))

(defn set-name [name]
  (let [tab (get-tab)]
    (data "filename" name)
    (.text tab name)))

(def show #(.tab % "show"))

(defn add [name elem]
  (let [id (core/unique-name name)
        a (dom/createDom "a" (object/create "href" (str "#" id)) id)
        div (dom/createDom "div" (object/create "id" id "class" "tab-pane") elem)]
    (core/log id)
    (core/log elem)
    (.append (core/jquery ".nav-tabs") (dom/createDom "li" nil a))
    (.append (core/jquery ".tab-content") div)
    (events/listen a goog.events.EventType.CLICK (fn [e]
                                                   (core/log e.target)
                                                   (.preventDefault e)
                                                   (show (core/jquery e.target))))
    (show (core/jquery a))))
