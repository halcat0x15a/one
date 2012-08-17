(ns onedit.vi
  (:require [onedit.core :as core]
            [onedit.buffer :as buffer]
            [onedit.cursor :as cursor])
  (:use-macros [onedit.core :only [defun]]))

(defun vi [editor]
  (core/register :i buffer/insert)
  (core/register :o buffer/append-newline)
  (core/register :O buffer/prepend-newline)
  (core/register :x buffer/delete-forward)
  (core/register :X buffer/delete-backward)
  (core/register :h cursor/left)
  (core/register :j cursor/down)
  (core/register :k cursor/up)
  (core/register :l cursor/right)
  (core/register :w cursor/forward)
  (core/register :b cursor/backward)
  (core/register :| cursor/start-line)
  (core/register :$ cursor/end-line)
  (core/register :gg cursor/start-buffer)
  (core/register :G cursor/end-buffer)
  editor)
