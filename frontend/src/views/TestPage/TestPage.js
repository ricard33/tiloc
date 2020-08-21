import React, { useEffect } from "react";
import { makeStyles } from "@material-ui/styles";
import { useDispatch, useSelector } from "react-redux";
import { Typography } from "@material-ui/core";
// import { useTranslation } from "react-i18next";
import * as actions from "../../actions";
import * as selectors from "../../selectors";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(2)
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  }
}));

const TestPage = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  // const { t } = useTranslation();
  // const booking = useSelector(store => selectors.bookings(store, 1));
  const contract = useSelector(store => selectors.contracts(store, 66));

  console.log(contract);
  useEffect(() => {
    dispatch(actions.fetchBookings());
    dispatch(actions.fetchContracts());
  }, [dispatch]);

  const content = `<div className="editor">
        <h2>Bilingual Personality Disorder</h2>
        <figure className="image image-style-side">
          <img src="https://c.cksource.com/a/1/img/docs/sample-image-bilingual-personality-disorder.jpg"/>
          <figcaption>One language, one person.</figcaption>
        </figure>
        <p>
          This may be the first time you hear about this made-up disorder but
          it actually isn’t so far from the truth. Even the studies that were conducted almost half a century show
          that
          <strong>the language you speak has more effects on you than you realise</strong>.
        </p>
          <img src="https://c.cksource.com/a/1/img/docs/sample-image-bilingual-personality-disorder.jpg"/>
        <p>
          One of the very first experiments conducted on this topic dates back to 1964.
          <a href="https://www.researchgate.net/publication/9440038_Language_and_TAT_content_in_bilinguals">In the
            experiment</a>
          designed by linguist Ervin-Tripp who is an authority expert in psycholinguistic and sociolinguistic studies,
          adults who are bilingual in English in French were showed series of pictures and were asked to create
          3-minute stories.
          In the end participants emphasized drastically different dynamics for stories in English and French.
        </p>
        <p>
          Another ground-breaking experiment which included bilingual Japanese women married to American men in San
          Francisco were
          asked to complete sentences. The goal of the experiment was to investigate whether or not human feelings and
          thoughts
          are expressed differently in <strong>different language mindsets</strong>.
        </p>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>English</th>
              <th>Japanese</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Real friends should</td>
              <td>Be very frank</td>
              <td>Help each other</td>
            </tr>
            <tr>
              <td>I will probably become</td>
              <td>A teacher</td>
              <td>A housewife</td>
            </tr>
            <tr>
              <td>When there is a conflict with family</td>
              <td>I do what I want</td>
              <td>It's a time of great unhappiness</td>
            </tr>
          </tbody>
        </table>
        <p>
          More recent <a href="https://books.google.pl/books?id=1LMhWGHGkRUC">studies</a> show, the language a person
          speaks affects
          their cognition, behaviour, emotions and hence <strong>their personality</strong>.
          This shouldn’t come as a surprise
          <a href="https://en.wikipedia.org/wiki/Lateralization_of_brain_function">since we already know</a> that
          different regions
          of the brain become more active depending on the person’s activity at hand. Since structure, information and
          especially
          <strong>the culture</strong> of languages varies substantially and the language a person speaks is an
          essential element of daily life.
        </p>
      </div>`;
  return (
    <div className={classes.root}>
      <h1>Test page</h1>
      <Typography variant="h1" component="h2" gutterBottom>
        h1. Heading
      </Typography>
      <Typography variant="h2" gutterBottom>
        h2. Heading
      </Typography>
      <Typography variant="h3" gutterBottom>
        h3. Heading
      </Typography>
      <Typography variant="h4" gutterBottom>
        h4. Heading
      </Typography>
      <Typography variant="h5" gutterBottom>
        h5. Heading
      </Typography>
      <Typography variant="h6" gutterBottom>
        h6. Heading
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        subtitle1. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        subtitle2. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur
      </Typography>
      <Typography variant="body1" gutterBottom>
        body1. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur
        unde suscipit, quam beatae rerum inventore consectetur, neque doloribus, cupiditate numquam
        dignissimos laborum fugiat deleniti? Eum quasi quidem quibusdam.
      </Typography>
      <Typography variant="body2" gutterBottom>
        body2. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos blanditiis tenetur
        unde suscipit, quam beatae rerum inventore consectetur, neque doloribus, cupiditate numquam
        dignissimos laborum fugiat deleniti? Eum quasi quidem quibusdam.
      </Typography>
      <Typography variant="button" display="block" gutterBottom>
        button text
      </Typography>
      <Typography variant="caption" display="block" gutterBottom>
        caption text
      </Typography>
      <Typography variant="overline" display="block" gutterBottom>
        overline text
      </Typography>
      {/*{*/}
      {/*  contract &&*/}
      {/*<Editor*/}
      {/*  content={contract.content}*/}
      {/*/>*/}
      {/*}*/}
    </div>
  );
};

export default TestPage;
