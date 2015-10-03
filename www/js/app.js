Parse.initialize("$PARSE_APPLICATION_ID", "$PARSE_JAVASCRIPT_KEY");

angular.module('todo', ['ionic'])
/**
 * The Projects factory handles saving and loading projects
 * from local storage, and also lets us save and load the
 * last active project index.
 */
.factory('Projects', function() {
  return {
    all: function() {
      var projectString = window.localStorage['projects'];
      if(projectString) {
        return angular.fromJson(projectString);
      }
      return [];
    },
    save: function(projects) {
      window.localStorage['projects'] = angular.toJson(projects);
    },
    newProject: function(projectTitle) {
      // Add a new project
      return {
        title: projectTitle,
        tasks: []
      };
    },
    getLastActiveIndex: function() {
      return parseInt(window.localStorage['lastActiveProject']) || 0;
    },
    setLastActiveIndex: function(index) {
      window.localStorage['lastActiveProject'] = index;
    }
  }
})

.factory('Tasks', function() {
  var Task = Parse.Object.extend("Task");
  return {
    all: function() {
      var Task = Parse.Object.extend("Task");
      var query = new Parse.Query(Task);

      query.find({
        success: function(results) {
          $scope.$apply(function() {
            $scope.tasks = results.map(function(obj) {
              return {title: obj.get("title"), parseObject: obj};
            });
          });
        },
        error: function(error) {
          alert("Error: " + error.code + " " + error.message);
        }
      });
    },
    save: function(task) {

      var taskObject = null;
      if (task.parseObject != undefined) {
          taskObject = task.parseObject;
      } else {
        taskObject = new Task();
      }

      taskObject.set("title", task.title);
      taskObject.save();

      task.title = "";
    },
    delete: function(task) {
      task.parseObject.destroy({
        success: function(myObject) {
          console.log('deleted.')
        },
        error: function(myObject, error) {
          console.log('failed to delete', error);
        }
      });
    }
  }
})

.controller('TodoCtrl', function($scope, $timeout, $ionicModal, Projects, Tasks, $ionicSideMenuDelegate, $ionicListDelegate) {

  $scope.shouldShowDelete = false;
  $scope.shouldShowReorder = false;
  $scope.listCanSwipe = true;

  $scope.tasks = Tasks.all();

  $scope.$watch('tasks', function(newVal, oldVal){
    console.log('changed');
  }, true);

  angular.element(document).ready(function () {

  });

  // A utility function for creating a new project
  // with the given projectTitle
  var createProject = function(projectTitle) {
    var newProject = Projects.newProject(projectTitle);
    $scope.projects.push(newProject);
    Projects.save($scope.projects);
    $scope.selectProject(newProject, $scope.projects.length-1);
  }

  // Load or initialize projects
  $scope.projects = Projects.all();

  // Grab the last active, or the first project
  $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];

  // Called to create a new project
  $scope.newProject = function() {
    var projectTitle = prompt('Project name');
    if(projectTitle) {
      createProject(projectTitle);
    }
  };

  // Called to select the given project
  $scope.selectProject = function(project, index) {
    $scope.activeProject = project;
    Projects.setLastActiveIndex(index);
    $ionicSideMenuDelegate.toggleLeft(false);
  };

  // Create our modal
  $ionicModal.fromTemplateUrl('new-task.html', function(modal) {
    $scope.taskModal = modal;
  }, {
    scope: $scope
  });

  $scope.createTask = function(task) {
    if(!$scope.activeProject || !task) {
      return;
    }
    $scope.activeProject.tasks.push({
      title: task.title
    });
    $scope.taskModal.hide();

    // Inefficient, but save all the projects
    Projects.save($scope.projects);

    Tasks.save(task);
    Tasks.all();
  };

  $scope.newTask = function() {
    $scope.task = null;
    $scope.taskModal.show();
  };

  $scope.edit = function(task) {
    $scope.task = task;
    $scope.taskModal.show();
  };

  $scope.delete = function(task) {
    Tasks.delete(task);
    Tasks.all();
  }

  $scope.closeNewTask = function() {
    $scope.taskModal.hide();
  }

  $scope.toggleProjects = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };

  // Try to create the first project, make sure to defer
  // this by using $timeout so everything is initialized
  // properly
  $timeout(function() {
    if($scope.projects.length == 0) {
      while(true) {
        var projectTitle = prompt('Your first project title:');
        if(projectTitle) {
          createProject(projectTitle);
          break;
        }
      }
    }
  });

});
