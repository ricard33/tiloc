import React, { useState } from "react";
import { Booking, Comment, User } from "../types";
import { formatDate, formatDistanceToNow } from "../common/dateUtils";
import { useTranslation } from "react-i18next";
import { Avatar, Box, IconButton, Paper, TextField } from "@mui/material";
import { red } from "@mui/material/colors";
import EditIcon from "@mui/icons-material/Edit";
import DoneIcon from "@mui/icons-material/Done";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteIcon from "@mui/icons-material/Delete";
import { stringAvatar } from "../common/avatarUtils";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { useCreateCommentMutation, useDeleteCommentMutation, useUpdateCommentMutation } from "../services/api";
import { fetchErrorDecode } from "../common/apiUtils";
import { useAlert } from "../common/alertUtils";
import { useConfirm } from "../libs/MuiConfirm";
import { differenceInSeconds } from "date-fns";

type Props = {
  booking: Booking;
  readonly?: boolean;
  onCommentAdded?: (comment: Comment) => void;
  onCommentModified?: (comment: Comment) => void;
  onCommentDeleted?: (comment: Comment) => void;
}

type EditComment = Pick<Comment, "id" | "content">;

function Comments(props: Props) {
  const { booking, readonly } = props;
  const [comments, setComments] = useState<Comment[]>(booking.comments);
  const { t } = useTranslation();
  const user = useSelector<RootState>((store) => store.auth.user) as User;
  const initialCommentState = { id: -1, content: "" };
  const [edited, setEdited] = useState<EditComment>(initialCommentState);
  const [createComment] = useCreateCommentMutation();
  const [updateComment] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const { showError, showSuccess } = useAlert();
  const confirm = useConfirm();
  const canViewComment = user.permissions.includes("core.view_comment");
  const canAddComment = user.permissions.includes("core.add_comment") && !readonly;
  const canChangeComment = user.permissions.includes("core.change_comment") && !readonly;
  const canDeleteComment = user.permissions.includes("core.delete_comment") && !readonly;

  function onCreateOrModifyComment(comment: EditComment) {
    if (comment.id <= 0) {
      createComment({ content: comment.content, booking_id: booking.id }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during comment creation", error);
          showError(t("Impossible to create comment: ") + fetchErrorDecode(error));
        } else {
          setEdited(initialCommentState);
          showSuccess(t("Comment added"));
          const newComment = (result as any).data as Comment;
          setComments([...comments, newComment]);
          if(props.onCommentAdded) props.onCommentAdded(newComment);
        }
      });
    } else {
      updateComment(comment).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during comment change", error);
          showError(t("Impossible to modify comment: ") + fetchErrorDecode(error));
        } else {
          setEdited(initialCommentState);
          showSuccess(t("Comment changed"));
          const newComment = (result as any).data as Comment;
          setComments(comments.map((c) => c.id === comment.id ? newComment : c));
          if(props.onCommentModified) props.onCommentModified(newComment);
        }
      });
    }
  }

  function onDeleteComment(comment: Comment) {
    confirm({
      title: t("Delete comment on {{ date }}", {
        date: formatDate(comment.created_on)
      }),
      description: t("Do you really want to permanently delete this comment?")
    })
      .then(() => {
        deleteComment(comment).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting comment", error);
            showError(t("Impossible to delete the comment: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Comment deleted"));
            setComments(comments.filter((c) => c.id !== comment.id));
            if(props.onCommentDeleted) props.onCommentDeleted(comment);
          }
        });
      });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && event.metaKey) {
      event.preventDefault();
      onCreateOrModifyComment(edited);
    }
  }

  return (
    <div>
      {
        canViewComment && comments && comments.map((comment) => (
          <Paper key={comment.id} sx={{ display: "flex", marginBottom: "4px", padding: "4px" }}>

            <Avatar {...stringAvatar(comment.created_by)} sx={{ bgcolor: red[500], marginRight: "16px" }} />
            <Box sx={{ flex: "1 1 auto" }}>
              <Box
                sx={{
                  fontSize: "smaller",
                  color: "dimgrey"
                }}
              >
                {t("by {{author}}", { author: comment.created_by.full_name }) + " " + formatDistanceToNow(comment.created_on)}
                {differenceInSeconds(comment.modified, comment.created_on) > 60 ? " " + t("(modified {{when}})", { when: formatDistanceToNow(comment.modified) }) : ""}
              </Box>
              <Box
                sx={{
                  marginBottom: "1em",
                  whiteSpace: "pre-line"
                }}
              >
                {edited.id !== comment.id ? comment.content :
                  <TextField
                    id="edit-comment"
                    label={t("Change your comment")}
                    multiline
                    maxRows={4}
                    fullWidth
                    value={edited.content}
                    onChange={(event) => setEdited({ ...edited, content: event.target.value })}
                    onKeyDown={(event) => onKeyDown(event)}
                  />
                }
              </Box>
            </Box>
            <Box sx={{ flex: "0 0 auto", width: "34px" }}>
              {user.id === comment.created_by.id &&
                (
                  edited.id !== comment.id
                    ?
                    <>
                      <IconButton aria-label="edit" disabled={!canChangeComment} onClick={() => setEdited(comment)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="delete" disabled={!canDeleteComment}
                        onClick={() => onDeleteComment(comment)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                    :
                    <>
                      <IconButton aria-label="validate" color={"success"} onClick={() => onCreateOrModifyComment(edited)}>
                        <DoneIcon />
                      </IconButton>
                      <IconButton aria-label="cancel" color={"error"} onClick={() => setEdited(initialCommentState)}>
                        <ClearIcon />
                      </IconButton>
                    </>

                )
              }
            </Box>
          </Paper>
        ))
      }
      {canAddComment &&
        <Paper sx={{ display: "flex", marginBottom: "4px", padding: "4px" }}>

          {/*<Avatar {...stringAvatar(edited.created_by)} sx={{ bgcolor: red[500], marginRight: "16px" }} />*/}
          <Box sx={{ flex: "1 1 auto" }}>
            <Box
              sx={{
                marginBottom: "1em",
                whiteSpace: "pre-line"
              }}
            >
              <TextField
                id="edit-comment"
                label={t("Add comment")}
                multiline
                maxRows={4}
                fullWidth
                disabled={edited.id > 0}
                value={edited.id <= 0 ? edited.content : ""}
                onChange={(event) => setEdited({ ...edited, content: event.target.value })}
                onKeyDown={(event) => onKeyDown(event)}
              />
            </Box>
          </Box>
          <Box sx={{ flex: "0 0 auto", width: "34px" }}>
            <IconButton
              aria-label="validate" color={"success"} disabled={edited.id > 0 || edited.content.length <= 0}
              onClick={() => onCreateOrModifyComment(edited)}
            >
              <DoneIcon />
            </IconButton>
            <IconButton
              aria-label="cancel" color={"error"} disabled={edited.id > 0 || edited.content.length <= 0}
              onClick={() => setEdited(initialCommentState)}
            >
              <ClearIcon />
            </IconButton>
          </Box>
        </Paper>
      }
    </div>
  );
}

export default Comments;
