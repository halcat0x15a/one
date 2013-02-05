(ns felis.group
  (:refer-clojure :exclude [empty])
;*CLJSBUILD-REMOVE*;  (:use-macros [felis.macros :only (tag)])
  (:require [clojure.string :as string]
            [felis.style :as style]
            [felis.buffer :as buffer]
            [felis.node :as node]
            [felis.minibuffer :as minibuffer]
            [felis.empty :as empty]))

;*CLJSBUILD-REMOVE*;(comment
(use '[felis.macros :only (tag)])
;*CLJSBUILD-REMOVE*;)

(defn render [buffer minibuffer]
  (tag :html {}
       (tag :head {}
            (tag :style {:type "text/css"}
                 "<!-- "
                 (->> style/all (interpose \space) string/join)
                 " -->"))
       (tag :body {}
            (tag :div {:class "editor"}
                 (node/render buffer)
                 (node/render minibuffer)))))

(defrecord Group [buffer minibuffer]
  node/Node
  (render [_] (render buffer minibuffer)))

(def path [:root])

(def empty (Group. buffer/empty minibuffer/empty))

(defmethod node/path Group [_] path)

(defmethod empty/empty Group [_] empty)
