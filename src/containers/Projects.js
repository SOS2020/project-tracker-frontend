import React, {useState, useEffect} from 'react';
import {Link, useHistory } from 'react-router-dom';
import {API, graphqlOperation} from 'aws-amplify';
import MoreButton from "../components/MoreButton";
import {useAuth} from "../lib/authLib";
import Modal from "../components/Modal";
import {FilePicker} from 'react-file-picker';

export default function Projects(props) {
    const history = useHistory();
    const auth = useAuth();

    // const [isLoading, setIsLoading] = useState(true);
    const [isInit, setIsInit] = useState(false);
    const [projects, setProjects] = useState([]);
    async function deleteProject(e, projectID) {
        e.preventDefault();
        // setIsLoading(true);
        const deleteQuery = `
            mutation {
                deleteProject(input: {
                    id: "${projectID}"
                }){
                    name id
                }
            }
        `
        try {
            await API.graphql(graphqlOperation(deleteQuery));
            setProjects(projects.filter(p => p.id !== projectID));
        } catch (error) {
            // setIsLoading(false);
            console.log(error);
        }

    }
    async function importProject(JSONobj)
    {
      let reader=new FileReader();
      
      reader.readAsText(JSONobj);
      reader.onload = function() {
        let JSONobject=JSON.parse(reader.result);
        JSONobject.events[0].filenames.map(d => `${d},`)
        let query=`
        mutation {
            createProject(input: {
                name: "${JSONobject.name}",
                id :"${JSONobject.projectid}",
                archived: ${JSONobject.public},
            }){
               createdAt updatedAt archived
            }
        }
        `;
       API.graphql(graphqlOperation(query)).catch(e => {
            console.log(e);
        });
        for(let i=0;i<JSONobject.events.length;i++)
        {let query2=`
        mutation {
          createEvent(input: {
              eventProjectId: "${JSONobject.projectid}",
              filenames: ["${ JSONobject.events[i].filenames.map(d => `${d}`)}"],
              note: """${JSONobject.events[i].name}""",
              id: "${JSONobject.events[i].id}"
              }) {
                id
                note
                time
                filenames
                hidden
                publicEvent{
                    id
                }
               
          }
        }`;
       API.graphql(graphqlOperation(query2)).catch(e => {
                console.log(e);
            });
        }
     };      
    
    }

    useEffect(() => {
        const listQuery = `
    query {
        listProjects{
        items{
            id
            name      
        }
        }
    }
    `

        function loadProjects() {
            return API.graphql(graphqlOperation(listQuery));
        }       

        async function onLoad() {
            if (auth.authState !== "signedIn"){
                history.push({pathname: "/login", state: {message: "You must be logged in to access projects."}});
                return;
            }
            const projectsData = await loadProjects();
            setProjects(projectsData.data.listProjects.items);
            // setIsLoading(false);
            setIsInit(true);
        }

        onLoad();
    }, [history, auth.authState]);

    return (

        <div>
            {/* {isLoading && (
                <p className="aside ~info">Loading...</p>
            )} */}
            {(props.location !== undefined) && (props.location.state !== undefined) && props.location.state.justLoggedIn && (
                <p className="aside ~info my-4">Logged in!</p>
            )}
            {(props.location !== undefined) && (props.location.state !== undefined) && props.location.state.projectDeleted && (
                <p className="aside ~info my-4">Project deleted.</p>
            )}
            {isInit && (
                <>
                    <Link to="/projects/new">
                        <button className="button !normal ~neutral my-4">New Project</button>
                    </Link>
                    <FilePicker
    extensions={['json']}
    onChange={FileObject => {importProject(FileObject);}}
  >
    <button className="button !normal ~neutral my-4" >
      Import Project
    </button>
  </FilePicker>

                    <p className="label my-4">Active Projects</p>
                    <div className="project-container grid md:grid-cols-2 gap-2 lg:grid-cols-3 my-4">
                        {projects.map((project) => (
                            <div key={project.id} className="card border relative overflow-visible">
                                <Link to={`/projects/${project.id}`}><p>{project.name}</p></Link>
                                <MoreButton className="top-4 right-4">
                                    <Modal
                                        buttonClassName="button ~critical !low"
                                        buttonText="Delete Project"
                                    >
                                        <p className="my-4">
                                            Are you sure you want to delete project <b>{project.name}</b>?
                                        </p>
                                        <button
                                            className="button ~critical !high"
                                            onClick={(e) => deleteProject(e, project.id)}>Delete
                                        </button>
                                    </Modal>
                                </MoreButton>
                            </div>
                        ))}
                    </div>
                    <hr className="my-16"></hr>
                    <p className="label my-4">Archived</p>
                </>
            )}
        </div>
    )

}
