'use strict';

const { likePostMutation, getLikePostResolver, likePostMutationConfig } = require('./api/post/graphql/post');

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    const extensionService = strapi.plugin('graphql').service('extension');
    const extension = ({ nexus }) => ({
      // GraphQL SDL
      typeDefs: likePostMutation,
      resolvers: {
        Mutation: {
          likePost: getLikePostResolver(strapi),
        },
      },
      resolversConfig: {
        'Mutation.likePost': likePostMutationConfig,
      },
    });
    extensionService.use(extension);

  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    // we listen to lifecycle events
    strapi.db.lifecycles.subscribe({
      models: ["admin::user"], //only listening to events for this model
      afterCreate: async ({ result }) => { // {result} = event
        // create an Author instance from  the fields of the Admin User
        // that has just been created

        // Extract the fields from the newly created Admin User
        const { id, firstname, lastname, email, username, createdAt, updatedAt } = result;
        //console.log(id, firstname, lastname, email, username, createdAt, updatedAt );
        await strapi.service("api::author.author").create({
          data: { firstname, lastname, email, username, createdAt, updatedAt, admin_user: [id] }
        });
      },
      afterUpdate: async ({ result }) => {
        // get the ID of the Author that corresponds
        // to the Admin User that's been just updated
        const correspondingAuthor = (await strapi.service("api::author.author").find({
          admin_user: [result.id]
        })).results[0]; //results

        // update the Author accordingly
        const { firstname, lastname, email, username, updatedAt } = result;
        await strapi.service("api::author.author").update(correspondingAuthor.id, {
          data: { firstname, lastname, email, username, updatedAt }
        })
      },
    });
  },
};
